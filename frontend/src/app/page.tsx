import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          YOLO Trainer Platform
        </h1>
        
        <p className="text-center text-lg mb-12">
          Build, label, train, and deploy YOLO object detection models with ease
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link href="/datasets" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              Datasets{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Create and manage your object detection datasets
            </p>
          </Link>

          <Link href="/labeling" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              Labeling{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Label your images with an intuitive interface
            </p>
          </Link>

          <Link href="/training" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              Training{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Train YOLO models with one click
            </p>
          </Link>

          <Link href="/models" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              Models{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Manage and deploy your trained models
            </p>
          </Link>

          <Link href="/testing" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              Testing{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Test your models with new images
            </p>
          </Link>

          <Link href="/api-docs" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              API Docs{' '}
              <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                →
              </span>
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Explore the API documentation
            </p>
          </Link>
        </div>

        <div className="text-center">
          <Link 
            href="/login" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  )
}
